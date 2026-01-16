import { Link } from 'react-router-dom'

type LogoProps = {
  asLink?: boolean
}

export default function Logo({ asLink = true }: LogoProps) {
  const content = (
    <>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#16a34a"/>
        <path d="M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4V6z" fill="#ECFDF5"/>
      </svg>
    </>
  )

  if (!asLink) {
    return <div className="d-inline-flex align-items-center gap-2">{content}</div>
  }

  return (
    <Link to="/" className="d-inline-flex align-items-center gap-2" aria-label="PrivilegedHealthHub - Home">
      {content}
    </Link>
  )
}
