const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit'
})

export const formatDate = (value) => {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return dateFormatter.format(date)
}

export const formatTime = (value) => {
  if (!value) return '—'
  const [hours, minutes] = value.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes))
  return timeFormatter.format(date)
}

export const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
    ...options
  }).format(Number(value))
}
