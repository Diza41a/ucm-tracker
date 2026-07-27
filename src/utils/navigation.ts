import { router, type Href } from 'expo-router';

import { toYearMonthKey } from '@/src/utils/display';

type NavigationRoute = {
  name: string;
  params?: Record<string, unknown>;
  state?: NavigationState;
};

type NavigationState = {
  type?: string;
  index?: number;
  routes: NavigationRoute[];
  routeNames?: string[];
};

type PartialNavigationState = {
  type?: string;
  index?: number;
  routes?: NavigationRoute[];
  routeNames?: string[];
};

type TabPressEvent = {
  preventDefault: () => void;
};

export type StackNavigation = {
  getState: () => NavigationState | PartialNavigationState;
  goBack: () => void;
  isFocused?: () => boolean;
  getParent?: () => TabCapableNavigation | undefined;
};

type TabCapableNavigation = {
  getState: () => NavigationState;
  getParent?: () => TabCapableNavigation | undefined;
};

export function canPopNavigationStack(navigation: StackNavigation) {
  const state = navigation.getState();
  return typeof state.index === 'number' && state.index > 0;
}

/** Pop one screen in the current stack, or replace with the tab root when at stack root. */
export function navigateBack(navigation: StackNavigation, fallbackHref: Href) {
  if (canPopNavigationStack(navigation)) {
    navigation.goBack();
    return;
  }
  router.replace(fallbackHref);
}

export function getTabRootHref(tabName: string): Href {
  if (tabName === 'wins') {
    const now = new Date();
    return `/(tabs)/wins/${toYearMonthKey(now.getFullYear(), now.getMonth() + 1)}`;
  }

  return `/(tabs)/${tabName}` as Href;
}

export function isNestedTabPath(tabName: string, pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const normalized = segments[0] === '(tabs)' ? segments.slice(1) : segments;

  if (normalized[0] !== tabName) return false;

  const rest = normalized.slice(1);

  if (tabName === 'wins') {
    if (rest.length === 0) return false;
    const now = new Date();
    const currentMonth = toYearMonthKey(now.getFullYear(), now.getMonth() + 1);
    return rest[0] !== currentMonth;
  }

  return rest.length > 0;
}

export function navigateTabToRoot(tabName: string) {
  router.replace(getTabRootHref(tabName));
}

/** Whether the focused tab has a nested screen open (stack index > 0, or non-current wins month). */
export function isNestedInTab(navigation: StackNavigation, tabName: string) {
  const stackState = getStackStateForTab(navigation, tabName);
  if (!stackState?.routes?.length) return false;
  return !isTabAtMainScreen(tabName, stackState);
}

function isTabNavigatorState(state: NavigationState | PartialNavigationState) {
  const routeNames = state.routeNames;
  return (
    state.type === 'tab' ||
    (Array.isArray(routeNames) &&
      routeNames.includes('tracker') &&
      routeNames.includes('settings'))
  );
}

function findTabNavigator(navigation: StackNavigation): TabCapableNavigation | undefined {
  let current: TabCapableNavigation | undefined = navigation.getParent?.();

  while (current) {
    const state = current.getState();
    if (isTabNavigatorState(state)) {
      return current;
    }
    current = current.getParent?.();
  }

  return navigation.getParent?.();
}

function getFocusedTabRoute(tabNavigation: TabCapableNavigation, tabName: string) {
  const tabState = tabNavigation.getState();
  const focusedRoute = tabState.routes[tabState.index ?? 0];
  if (focusedRoute?.name !== tabName) return null;
  return focusedRoute;
}

function isTabAtMainScreen(
  tabName: string,
  stackState?: NavigationState | PartialNavigationState
) {
  if (!stackState?.routes?.length) return true;

  const index = stackState.index ?? 0;
  const active = stackState.routes[index];

  if (tabName === 'wins') {
    const now = new Date();
    const currentMonth = toYearMonthKey(now.getFullYear(), now.getMonth() + 1);
    const yearMonth = (active?.params as { yearMonth?: string } | undefined)?.yearMonth;
    return index === 0 && yearMonth === currentMonth;
  }

  return index === 0;
}

function getStackStateForTab(
  navigation: StackNavigation,
  tabName: string
): NavigationState | PartialNavigationState | undefined {
  const localState = navigation.getState();

  if (isTabNavigatorState(localState)) {
    const tabRoute = localState.routes?.find((route) => route.name === tabName);
    return tabRoute?.state;
  }

  const tabNavigation = findTabNavigator(navigation);
  if (tabNavigation) {
    const tabRoute = tabNavigation.getState().routes.find((route) => route.name === tabName);
    if (tabRoute?.state) {
      return tabRoute.state;
    }
  }

  return localState.routes?.length ? localState : undefined;
}

function isTabAlreadyFocused(navigation: StackNavigation, tabName: string) {
  if (navigation.isFocused?.()) return true;

  const tabNavigation = findTabNavigator(navigation);
  if (!tabNavigation) return false;

  return getFocusedTabRoute(tabNavigation, tabName) != null;
}

/** When the active tab is pressed again, return to that tab's main screen. */
export function createTabPressToRootListener(tabName: string) {
  return ({ navigation }: { navigation: StackNavigation }) => ({
    tabPress: (e: TabPressEvent) => {
      if (!isTabAlreadyFocused(navigation, tabName)) return;

      const stackState = getStackStateForTab(navigation, tabName);
      if (isTabAtMainScreen(tabName, stackState)) return;

      e.preventDefault();
      navigateTabToRoot(tabName);
    },
  });
}
