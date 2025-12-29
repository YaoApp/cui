/**
 * App Menu Reload Action
 * Refresh the application menu/navigation.
 */

/**
 * Execute app.menu.reload action
 */
export const appMenuReload = (): void => {
	window.$app?.Event?.emit('app/getUserMenu')
}

export default appMenuReload
