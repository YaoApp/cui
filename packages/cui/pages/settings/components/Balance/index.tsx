import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Balance = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.balance}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '账户余额' : 'Account Balance'}</h2>
					<p>
						{is_cn
							? '管理您的点数余额，充值点数和查看消费记录'
							: 'Manage your credits balance, top up credits and view transaction history'}
					</p>
				</div>
			</div>

			{/* Content Panel */}
			<div className={styles.panel}>
				<div className={styles.panelContent}>
					{/* Coming Soon State */}
					<div className={styles.comingSoon}>
						<div className={styles.comingSoonContent}>
							<Icon
								name='material-construction'
								size={64}
								className={styles.comingSoonIcon}
							/>
							<h3 className={styles.comingSoonTitle}>
								{is_cn ? '功能开发中' : 'Under Development'}
							</h3>
							<p className={styles.comingSoonDescription}>
								{is_cn
									? '点数充值和余额管理功能正在紧张开发中，敬请期待！'
									: 'Credits top-up and balance management features are under development. Stay tuned!'}
							</p>
							<div className={styles.comingSoonFeatures}>
								<div className={styles.featureItem}>
									<Icon name='material-account_balance_wallet' size={20} />
									<span>{is_cn ? '查看点数余额' : 'View Credits Balance'}</span>
								</div>
								<div className={styles.featureItem}>
									<Icon name='material-add_card' size={20} />
									<span>{is_cn ? '在线充值点数' : 'Online Credits Top-up'}</span>
								</div>
								<div className={styles.featureItem}>
									<Icon name='material-history' size={20} />
									<span>{is_cn ? '消费记录查询' : 'Transaction History'}</span>
								</div>
								<div className={styles.featureItem}>
									<Icon name='material-receipt' size={20} />
									<span>{is_cn ? '充值发票管理' : 'Invoice Management'}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Balance
