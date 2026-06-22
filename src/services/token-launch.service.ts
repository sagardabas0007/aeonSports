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
   * Launch token on Clanker
   * Note: This is a placeholder implementation. Update with actual Clanker API endpoints.
   */
  private async launchOnClanker(metadata: TokenMetadata): Promise<TokenLaunchResult> {
    try {
      const clankerApiUrl = process.env.CLANKER_API_URL || 'https://api.clanker.world';
      const wallet = walletService.getWallet();

      // Prepare token data
      const tokenData = {
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        description: metadata.description,
        deployer: wallet.address,
        metadata: {
          playerName: metadata.playerName,
          awardType: metadata.awardType,
          match: metadata.matchInfo,
        },
      };

      // Sign the token data
      const signature = await wallet.signMessage(JSON.stringify(tokenData));

      // Call Clanker API
      const response = await axios.post(
        `${clankerApiUrl}/deploy`,
        {
          ...tokenData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLANKER_API_KEY || ''}`,
          },
        }
      );

      return {
        success: true,
        contractAddress: response.data.contractAddress,
        transactionHash: response.data.transactionHash,
        platform: 'clanker',
      };
    } catch (error: any) {
      console.error('Clanker launch error:', error);

      // If Clanker API is not configured, return a mock success for development
      if (process.env.NODE_ENV === 'development' && !process.env.CLANKER_API_KEY) {
        console.warn('Clanker API not configured, returning mock data');
        return {
          success: true,
          contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
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
