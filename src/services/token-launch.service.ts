import { TokenMetadata } from '@/types/ai-analysis';
import { LaunchPlatform } from '@/types/database';
import { walletService } from './wallet.service';
import { createFlaunch, ReadWriteFlaunchSDK } from '@flaunch/sdk';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export interface TokenLaunchResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  platform: LaunchPlatform;
  error?: string;
}

class TokenLaunchService {
  /**
   * Launch token on specified platform
   */
  async launchToken(
    metadata: TokenMetadata,
    platform: LaunchPlatform
  ): Promise<TokenLaunchResult> {
    try {
      if (platform === 'clanker') {
        return await this.launchOnClanker(metadata);
      } else if (platform === 'flaunch') {
        return await this.launchOnFlaunch(metadata);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error: any) {
      console.error(`Error launching token on ${platform}:`, error);
      return {
        success: false,
        platform,
        error: error.message,
      };
    }
  }

  /**
   * Launch token on both platforms
   */
  async launchOnBothPlatforms(metadata: TokenMetadata): Promise<{
    clanker: TokenLaunchResult;
    flaunch: TokenLaunchResult;
  }> {
    const [clanker, flaunch] = await Promise.all([
      this.launchOnClanker(metadata),
      this.launchOnFlaunch(metadata),
    ]);

    return { clanker, flaunch };
  }

  /**
   * Initialize Clanker v4 SDK client
   */
  private getClankerClient(): Clanker {
    const privateKey = process.env.TREASURY_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TREASURY_WALLET_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    }) as PublicClient;

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    return new Clanker({ wallet: walletClient, publicClient });
  }

  /**
   * Launch token on Clanker using clanker-sdk v4
   */
  private async launchOnClanker(metadata: TokenMetadata): Promise<TokenLaunchResult> {
    try {
      const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS;
      if (!treasuryWallet) {
        throw new Error('TREASURY_WALLET_ADDRESS not configured');
      }

      const clanker = this.getClankerClient();

      const result = await clanker.deploy({
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        image: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        tokenAdmin: treasuryWallet as `0x${string}`,
        chainId: 8453,
        metadata: {
          description: metadata.description,
        },
        context: {
          interface: 'AeonSports',
          platform: 'AeonSports',
          messageId: metadata.tokenSymbol,
          id: metadata.tokenSymbol,
        },
        rewards: {
          recipients: [
            {
              admin: treasuryWallet as `0x${string}`,
              recipient: treasuryWallet as `0x${string}`,
              bps: 10000,
              token: 'Both',
            },
          ],
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const deployed = await result.waitForTransaction();
      if (deployed.error) {
        throw new Error(deployed.error.message);
      }

      return {
        success: true,
        contractAddress: deployed.address,
        transactionHash: result.txHash,
        platform: 'clanker',
      };
    } catch (error: any) {
      console.error('Clanker launch error:', error);

      if (process.env.NODE_ENV === 'development' && !process.env.TREASURY_WALLET_PRIVATE_KEY) {
        console.warn('Clanker SDK not configured, returning mock data');
        return {
          success: true,
          contractAddress: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`,
          platform: 'clanker',
        };
      }

      throw error;
    }
  }

  /**
   * Initialize Flaunch SDK client
   */
  private getFlaunchClient(): ReadWriteFlaunchSDK {
    const privateKey = process.env.TREASURY_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TREASURY_WALLET_PRIVATE_KEY not configured');
    }

    // Create viem clients for Base mainnet
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    return createFlaunch({
      publicClient,
      walletClient,
    }) as ReadWriteFlaunchSDK;
  }

  /**
   * Generate a simple placeholder image data URL for token
   */
  private generateTokenImage(symbol: string): string {
    // Create a simple SVG as base64
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#d24b40"/>
        <text x="100" y="100" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold">
          ${symbol.substring(0, 3)}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Launch token on Flaunch using SDK
   */
  private async launchOnFlaunch(metadata: TokenMetadata): Promise<TokenLaunchResult> {
    try {
      const flaunchClient = this.getFlaunchClient();
      const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS;

      if (!treasuryWallet) {
        throw new Error('TREASURY_WALLET_ADDRESS not configured');
      }

      // Generate token image
      const base64Image = this.generateTokenImage(metadata.tokenSymbol);

      // Launch token with Flaunch SDK
      const hash = await flaunchClient.flaunchIPFS({
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        fairLaunchPercent: 0, // No fair launch window
        fairLaunchDuration: 0, // Immediate launch
        initialMarketCapUSD: 10_000, // $10k starting market cap (no protocol fees below $10k)
        creator: treasuryWallet as `0x${string}`,
        creatorFeeAllocationPercent: 100, // 100% fees to treasury
        metadata: {
          base64Image,
          description: metadata.description,
          // Optional: Add social links if available
        },
      });

      // Parse transaction to get memecoin address
      const poolCreatedData = await flaunchClient.getPoolCreatedFromTx(hash);

      if (!poolCreatedData) {
        throw new Error('Failed to parse Flaunch transaction');
      }

      return {
        success: true,
        contractAddress: poolCreatedData.memecoin,
        transactionHash: hash,
        platform: 'flaunch',
      };
    } catch (error: any) {
      console.error('Flaunch launch error:', error);

      // If wallet is not configured, return a mock success for development
      if (process.env.NODE_ENV === 'development' && !process.env.TREASURY_WALLET_PRIVATE_KEY) {
        console.warn('Flaunch SDK not configured, returning mock data');
        return {
          success: true,
          contractAddress: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`,
          platform: 'flaunch',
        };
      }

      throw error;
    }
  }

  /**
   * Verify token deployment on chain
   */
  async verifyTokenDeployment(contractAddress: string): Promise<boolean> {
    try {
      const provider = walletService.getProvider();
      const code = await provider.getCode(contractAddress);

      // If code is '0x', the contract doesn't exist
      return code !== '0x';
    } catch (error) {
      console.error('Error verifying token deployment:', error);
      return false;
    }
  }
}

export const tokenLaunchService = new TokenLaunchService();
