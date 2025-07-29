import { observer } from 'mobx-react-lite'

function Index() {
	// User enable 2FA, and the default 2FA is TOTP,or the client ask for 2FA, and the default 2FA is TOTP
	console.log('login totp')
	return <div className='w_100vw h_100vh flex justify_center align_center'>Auth Login TOTP</div>
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
