import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 1, textAlign: 'center' }}>
      {icon && <Box sx={{ color: '#3f3f46', mb: 0.5 }}>{icon}</Box>}
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
      {description && (
        <Typography variant="caption" sx={{ color: '#52525b', maxWidth: 300, display: 'block' }}>{description}</Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  )
}
