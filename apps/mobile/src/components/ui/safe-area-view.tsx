// web: n/a (layout primitive) | android: same
/**
 * SafeAreaView with Uniwind className support. react-native-safe-area-context
 * is not a react-native core component, so Uniwind needs withUniwind to map
 * className to style. Screens import this, never the library directly.
 */
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const SafeAreaView = withUniwind(RNSafeAreaView);
