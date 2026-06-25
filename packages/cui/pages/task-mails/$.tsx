import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import MailTimeline from '../inbox/components/MailTimeline'

const TaskMails = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''

	if (!taskId) return null

	return <MailTimeline chatId={taskId} />
}

export default TaskMails
