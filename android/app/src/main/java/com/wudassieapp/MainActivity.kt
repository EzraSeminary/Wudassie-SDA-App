package com.wudassieapp

import android.os.Bundle
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.view.WindowManager

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "WudassieApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens fragments must be recreated by React Native, not restored
    // by Android's saved FragmentManager state.
    super.onCreate(null)

    // Apply status bar and navigation bar colors from resources so Android system bars
    // match the app theme colors defined in res/values/colors.xml (and night variants).
    try {
      val window = window
      val statusColor = ContextCompat.getColor(this, R.color.status_bar)
      val navColor = ContextCompat.getColor(this, R.color.navigation_bar)
      window.statusBarColor = statusColor
      window.navigationBarColor = navColor
      // Make sure content doesn't overlap system bars
      window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
      window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
    } catch (e: Exception) {
      // ignore if resources not available on older devices
    }
  }
}
