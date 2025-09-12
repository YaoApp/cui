import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { Button } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

export interface CardItem {
	id: string
	[key: string]: any
}

export interface CardListProps<T extends CardItem> {
	data: T[]
	loading: boolean
	loadingMore: boolean
	hasMore: boolean
	onLoadMore: () => void
	renderCard: (item: T) => ReactNode
	emptyText?: string
	emptyIcon?: string
	className?: string
	cardClassName?: string
}

function CardList<T extends CardItem>({
	data,
	loading,
	loadingMore,
	hasMore,
	onLoadMore,
	renderCard,
	emptyText,
	emptyIcon = 'material-inbox',
	className,
	cardClassName
}: CardListProps<T>) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 防止重复请求的 ref
	const isLoadingRef = useRef(false)

	// Intersection Observer 监听滚动触发器
	useEffect(() => {
		if (!hasMore || loadingMore || data.length === 0) {
			return
		}

		// 检查是否在浏览器环境中
		if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
			return
		}

		let observer: IntersectionObserver | null = null
		let rafId: number | null = null

		// 设置观察器的函数
		const setupObserver = () => {
			try {
				// 使用 window.document 确保获取真正的 DOM document 对象
				const workingDocument = window.document
				if (!workingDocument || typeof workingDocument.querySelectorAll !== 'function') {
					rafId = requestAnimationFrame(setupObserver)
					return
				}

				// 查找最后一个卡片元素
				const allCards = workingDocument.querySelectorAll('[data-card-item="true"]')
				const lastCard = allCards[allCards.length - 1] as HTMLElement

				if (!lastCard || data.length === 0) {
					// 如果没有找到卡片，使用 requestAnimationFrame 重试
					rafId = requestAnimationFrame(setupObserver)
					return
				}

				// 创建观察器
				observer = new IntersectionObserver(
					(entries) => {
						const triggerEntry = entries[0]
						if (
							triggerEntry.isIntersecting &&
							hasMore &&
							!loadingMore &&
							!isLoadingRef.current
						) {
							// 立即断开观察器，防止重复触发
							observer?.disconnect()
							isLoadingRef.current = true
							onLoadMore()
							// 重置加载标记
							setTimeout(() => {
								isLoadingRef.current = false
							}, 1000)
						}
					},
					{
						threshold: 0.1, // 当10%的最后一个卡片可见时触发
						rootMargin: '100px' // 提前100px开始加载
					}
				)

				// 开始观察最后一个卡片
				observer.observe(lastCard)
			} catch (error) {
				console.warn('Failed to setup intersection observer:', error)
			}
		}

		// 使用 requestAnimationFrame 确保 DOM 渲染完成后执行
		rafId = requestAnimationFrame(setupObserver)

		// 清理函数
		return () => {
			if (observer) {
				observer.disconnect()
			}
			if (rafId) {
				cancelAnimationFrame(rafId)
			}
		}
	}, [hasMore, loadingMore, data.length, onLoadMore])

	// 渲染内容
	const renderContent = () => {
		if (loading) {
			return (
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<p>{is_cn ? '加载中...' : 'Loading...'}</p>
				</div>
			)
		}

		if (data.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name={emptyIcon} size={48} />
					<p>{emptyText || (is_cn ? '暂无数据' : 'No data available')}</p>
				</div>
			)
		}

		return (
			<>
				<div className={styles.cardGrid}>
					{data.map((item) => (
						<div
							key={item.id}
							className={`${styles.cardWrapper} ${cardClassName || ''}`}
							data-card-item='true'
						>
							{renderCard(item)}
						</div>
					))}
				</div>

				{/* 加载更多指示器 */}
				{loadingMore && (
					<div className={styles.loadingMore}>
						<Icon name='material-hourglass_empty' size={16} className={styles.loadingIcon} />
						<span>{is_cn ? '加载更多...' : 'Loading more...'}</span>
					</div>
				)}
			</>
		)
	}

	return <div className={`${styles.cardList} ${className || ''}`}>{renderContent()}</div>
}

export default CardList
