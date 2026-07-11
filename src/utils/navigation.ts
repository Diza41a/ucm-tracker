import { router, type Href } from 'expo-router';

export function navigateBack(fallbackHref: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}
