/**
 * @format
 */

import {AppRegistry} from 'react-native';
// Run font setup first so defaultProps are applied before other modules import Text
import './setupFonts';
import App from './App';
import {name as appName} from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import { notificationService } from './src/services/notificationService';

AppRegistry.registerComponent(appName, () => App);

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    await notificationService.handleNotificationPress(detail.notification?.data);
  }
  if (type === EventType.DELIVERED) {
    await notificationService.scheduleNextDailyReminder();
  }
});
