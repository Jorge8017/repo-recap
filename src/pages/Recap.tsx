import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { PhoneFrame } from '../components/PhoneFrame'
import { StoryPlayer } from '../components/StoryPlayer'
import { useRecap } from '../hooks/useRecap'
import { isValidGitHubUsername, normalizeUsername } from '../lib/username'
import { useParams } from 'react-router-dom'

export function Recap() {
  const { username: rawUsername } = useParams()
  const username = normalizeUsername(rawUsername ?? '')
  const valid = isValidGitHubUsername(username)
  const query = useRecap(valid ? username : undefined)

  return (
    <PhoneFrame>
      {!valid ? (
        <ErrorState kind="not_found" />
      ) : query.data ? (
        <StoryPlayer recap={query.data} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState />
      )}
    </PhoneFrame>
  )
}
