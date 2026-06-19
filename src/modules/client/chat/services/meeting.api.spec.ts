import api from '@/lib/axiosIns';
import {
  getActiveMeetingAPI,
  getMeetingByIdAPI,
  createMeetingAPI,
  getMeetingConnectionDetailsAPI,
  MeetingApiError,
} from './meeting.api';

// Mock the axios instance
jest.mock('@/lib/axiosIns', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  isAxiosError: jest.fn(),
}));

describe('meeting.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveMeetingAPI', () => {
    it('should return a meeting when the API call is successful', async () => {
      const mockMeeting = { _id: '123', status: 'active' };
      (api.get as jest.Mock).mockResolvedValue({ data: { data: mockMeeting } });

      const result = await getActiveMeetingAPI('channel-1');

      expect(api.get).toHaveBeenCalledWith('/meetings/channel/channel-1/active');
      expect(result).toEqual(mockMeeting);
    });

    it('should throw a MeetingApiError when the API call fails', async () => {
      const mockError = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(getActiveMeetingAPI('channel-1')).rejects.toThrow(
        MeetingApiError,
      );
    });
  });

  describe('getMeetingConnectionDetailsAPI', () => {
    it('should return connection details when API call is successful', async () => {
      const mockDetails = {
        serverUrl: 'wss://test.livekit.cloud',
        roomName: 'test-room',
        participantName: 'Test User',
        participantToken: 'test-token',
      };
      (api.post as jest.Mock).mockResolvedValue({ data: mockDetails });

      const result = await getMeetingConnectionDetailsAPI('meeting-1');

      expect(api.post).toHaveBeenCalledWith('/meetings/meeting-1/connection-details');
      expect(result).toEqual(mockDetails);
    });

    it('should throw a MeetingApiError when the API call fails', async () => {
      const mockError = new Error('Network error');
      (api.post as jest.Mock).mockRejectedValue(mockError);

      await expect(getMeetingConnectionDetailsAPI('meeting-1')).rejects.toThrow(
        MeetingApiError,
      );
    });
  });
});
