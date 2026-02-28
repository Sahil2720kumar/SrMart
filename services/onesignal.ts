// services/onesignal.ts
import { OneSignal } from 'react-native-onesignal';

// Call this after login
export const setupOneSignalUser = (user: {
  id: string;
  role: 'customer' | 'vendor' | 'delivery_boy';
}) => {
  // Link OneSignal to your user
  OneSignal.login(user.id); // sets external user ID

  // Tag with role & info for segmenting
  OneSignal.User.addTags({
    role: user.role,
    user_id: user.id,
  });
};

// Call on logout
export const clearOneSignalUser = () => {
  OneSignal.logout();
  OneSignal.User.removeTags(['role', 'user_id']);
};