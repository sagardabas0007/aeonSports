import axios from 'axios';
import {
  ApiFootballResponse,
  ApiFootballFixture,
  ApiFootballPlayerStats,
  ApiFootballFixtureStatistics,
} from '@/types/fifa-api';

const API_BASE_URL = 'https://v3.football.api-sports.io';

class FifaApiService {
  private apiKey: string;
  private axiosInstance;

  constructor() {
    this.apiKey = process.env.FIFA_API_KEY || '';

    if (!this.apiKey) {
      console.warn('FIFA_API_KEY not set. FIFA API calls will fail.');
    }

    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });
  }

  /**
   * Get fixtures by status
   * @param status - 'LIVE' | 'NS' (Not Started) | 'FT' (Finished)
   */
  async getFixturesByStatus(status: 'LIVE' | 'NS' | 'FT', date?: string): Promise<ApiFootballFixture[]> {
    try {
      const params: any = { status };

      // For upcoming and finished matches, use date
      if (date && (status === 'NS' || status === 'FT')) {
        params.date = date; // Format: YYYY-MM-DD
      }

      const response = await this.axiosInstance.get<ApiFootballResponse<ApiFootballFixture>>(
        '/fixtures',
        { params }
      );

      return response.data.response;
    } catch (error) {
      console.error('Error fetching fixtures by status:', error);
      throw error;
    }
  }

  /**
   * Get live fixtures
   */
  async getLiveFixtures(): Promise<ApiFootballFixture[]> {
    return this.getFixturesByStatus('LIVE');
  }

  /**
   * Get upcoming fixtures (today and tomorrow)
   */
  async getUpcomingFixtures(): Promise<ApiFootballFixture[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getFixturesByStatus('NS', today);
  }

  /**
   * Get finished fixtures (today)
   */
  async getFinishedFixtures(): Promise<ApiFootballFixture[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getFixturesByStatus('FT', today);
  }

  /**
   * Get fixture by ID
   */
  async getFixtureById(fixtureId: number): Promise<ApiFootballFixture | null> {
    try {
      const response = await this.axiosInstance.get<ApiFootballResponse<ApiFootballFixture>>(
        '/fixtures',
        { params: { id: fixtureId } }
      );

      return response.data.response[0] || null;
    } catch (error) {
      console.error(`Error fetching fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Get player statistics for a fixture
   */
  async getFixturePlayers(fixtureId: number): Promise<ApiFootballPlayerStats[]> {
    try {
      const response = await this.axiosInstance.get<ApiFootballResponse<ApiFootballPlayerStats>>(
        '/fixtures/players',
        { params: { fixture: fixtureId } }
      );

      return response.data.response;
    } catch (error) {
      console.error(`Error fetching players for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Get match statistics for a fixture
   */
  async getFixtureStatistics(fixtureId: number): Promise<ApiFootballFixtureStatistics[]> {
    try {
      const response = await this.axiosInstance.get<ApiFootballResponse<ApiFootballFixtureStatistics>>(
        '/fixtures/statistics',
        { params: { fixture: fixtureId } }
      );

      return response.data.response;
    } catch (error) {
      console.error(`Error fetching statistics for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  /**
   * Get complete match data including players and statistics
   */
  async getCompleteMatchData(fixtureId: number) {
    try {
      const [fixture, players, statistics] = await Promise.all([
        this.getFixtureById(fixtureId),
        this.getFixturePlayers(fixtureId),
        this.getFixtureStatistics(fixtureId),
      ]);

      return {
        fixture,
        players,
        statistics,
      };
    } catch (error) {
      console.error(`Error fetching complete match data for fixture ${fixtureId}:`, error);
      throw error;
    }
  }
}

export const fifaApiService = new FifaApiService();
