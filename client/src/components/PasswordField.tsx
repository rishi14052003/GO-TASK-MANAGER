import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  id?: string
  label?: string
  autoComplete: 'current-password' | 'new-password'
  placeholder: string
}

export default function PasswordField({
  id = 'password',
  label = 'Password',
  autoComplete,
  placeholder,
}: Props) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-controls={id}
          onClick={() => setVisible(!visible)}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
