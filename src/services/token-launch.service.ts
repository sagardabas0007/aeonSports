import axios from 'axios';
import { TokenMetadata } from '@/types/ai-analysis';
import { LaunchPlatform } from '@/types/database';
import { walletService } from './wallet.service';

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
   * Generate unique 32-character request key for Clanker
   */
  private generateRequestKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Launch token on Clanker using v4.0.0 API
   */
  private async launchOnClanker(metadata: TokenMetadata): Promise<TokenLaunchResult> {
    try {
      const clankerApiUrl = process.env.CLANKER_API_URL || 'https://www.clanker.world';
      const wallet = walletService.getWallet();
      const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS;

      if (!treasuryWallet) {
        throw new Error('TREASURY_WALLET_ADDRESS not configured');
      }

      // Generate unique request key
      const requestKey = this.generateRequestKey();

      // Prepare v4.0.0 token deployment payload
      const deploymentPayload = {
        token: {
          name: metadata.tokenName,
          symbol: metadata.tokenSymbol,
          tokenAdmin: wallet.address, // Token admin for managing vaulted tokens
          description: metadata.description,
          requestKey: requestKey,
          // Optional: Add social media URLs if available
          socialMediaUrls: [],
        },
        rewards: [
          {
            admin: treasuryWallet,
            recipient: treasuryWallet,
            allocation: 100, // 100% of rewards to treasury
            rewardsToken: "Both", // Receive rewards in both Clanker and paired token
          },
        ],
        pool: {
          type: "standard",
          pairedToken: "0x4200000000000000000000000000000000000006", // WETH on Base
          initialMarketCap: 10, // 10 WETH starting market cap
        },
        fees: {
          type: "static",
          clankerFee: 1, // 1% fee on Clanker token inputs
          pairedFee: 1, // 1% fee on WETH inputs
        },
        chainId: 8453, // Base mainnet
      };

      // Call Clanker v4.0.0 API
      const response = await axios.post(
        `${clankerApiUrl}/api/tokens/deploy/v4`,
        deploymentPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CLANKER_API_KEY || '',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          contractAddress: response.data.expectedAddress,
          transactionHash: '', // Transaction hash not immediately available
          platform: 'clanker',
        };
      } else {
        throw new Error('Token deployment failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Clanker launch error:', error);

      // If Clanker API is not configured, return a mock success for development
      if (process.env.NODE_ENV === 'development' && !process.env.CLANKER_API_KEY) {
        console.warn('Clanker API not configured, returning mock data');
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
   * Launch token on Flaunch
   * Note: This is a placeholder implementation. Update with actual Flaunch API endpoints.
   */
  private async launchOnFlaunch(metadata: TokenMetadata): Promise<TokenLaunchResult> {
    try {
      const flaunchApiUrl = process.env.FLAUNCH_API_URL || 'https://api.flaunch.io';
      const wallet = walletService.getWallet();

      // Prepare token data
      const tokenData = {
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        description: metadata.description,
        creator: wallet.address,
        initialSupply: '1000000000', // 1 billion tokens
        metadata: {
          playerName: metadata.playerName,
          awardType: metadata.awardType,
          match: metadata.matchInfo,
        },
      };

      // Sign the token data
      const message = `Launch token: ${metadata.tokenName} (${metadata.tokenSymbol})`;
      const signature = await wallet.signMessage(message);

      // Call Flaunch API
      const response = await axios.post(
        `${flaunchApiUrl}/launch`,
        {
          ...tokenData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.FLAUNCH_API_KEY || '',
          },
        }
      );

      return {
        success: true,
        contractAddress: response.data.token.address,
        transactionHash: response.data.transaction.hash,
        platform: 'flaunch',
      };
    } catch (error: any) {
      console.error('Flaunch launch error:', error);

      // If Flaunch API is not configured, return a mock success for development
      if (process.env.NODE_ENV === 'development' && !process.env.FLAUNCH_API_KEY) {
        console.warn('Flaunch API not configured, returning mock data');
        return {
          success: true,
          contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
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
