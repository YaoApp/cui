import { observer } from 'mobx-react-lite'

function Index() {
	console.log('consent')
	return <div className='w_100vw h_100vh flex justify_center align_center'>Auth Consent</div>
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
