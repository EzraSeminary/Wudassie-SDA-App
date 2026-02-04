/**
 * @format
 */

import {AppRegistry} from 'react-native';
// Run font setup first so defaultProps are applied before other modules import Text
import './setupFonts';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
