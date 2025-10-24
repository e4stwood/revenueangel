import { verifyUserToken } from '@whop/api';
import Whop from '@whop/sdk';
import { config } from './shared-utils';

export { verifyUserToken };

// Initialize Whop SDK client
const whopClient = new Whop({
  appID: process.env.WHOP_APP_ID || '',
  apiKey: config.WHOP_API_KEY || '',
});

export const whopApi = {
  async checkIfUserHasAccessToCompany({ userId, companyId }: { userId: string; companyId: string }) {
    try {
      // Use Whop SDK to get company and check membership
      const company = await whopClient.companies.retrieve(companyId);
      
      if (!company) {
        return {
          hasAccessToCompany: {
            accessLevel: 'none' as const
          }
        };
      }

      // Check if user is the company owner
      const isOwner = (company as any).owner?.id === userId || (company as any).owner_id === userId;
      
      return {
        hasAccessToCompany: {
          accessLevel: isOwner ? 'owner' as const : 'none' as const
        }
      };
    } catch (error) {
      console.error('Error checking user access:', error);
      return {
        hasAccessToCompany: {
          accessLevel: 'none' as const
        }
      };
    }
  },

  async retrieveUser({ userId }: { userId: string }) {
    try {
      // Use Whop SDK to retrieve user
      const userData = await whopClient.users.retrieve(userId);
      
      return {
        publicUser: userData
      };
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  }
};

// Export the Whop SDK client for use in other modules
export { whopClient }; 