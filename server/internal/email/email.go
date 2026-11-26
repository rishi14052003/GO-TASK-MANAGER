package email

import (
	"bytes"
	"errors"
	"fmt"
	"html/template"
	"mime"
	"net/mail"
	"net/smtp"
	"os"
	"strings"
)

type EmailService struct{ from, password, host, port string }

func NewEmailService() *EmailService {
	return &EmailService{from: os.Getenv("SMTP_FROM"), password: strings.ReplaceAll(os.Getenv("SMTP_PASS"), " ", ""), host: "smtp.gmail.com", port: "587"}
}

func (e *EmailService) send(to, subject, body string) error {
	if e.from == "" || e.password == "" {
		return errors.New("SMTP_FROM and SMTP_PASS are required")
	}
	for _, value := range []string{e.from, to} {
		addr, err := mail.ParseAddress(value)
		if err != nil || addr.Address != value || strings.ContainsAny(value, "\r\n") {
			return errors.New("invalid mail address")
		}
	}
	message := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", e.from, to, mime.QEncoding.Encode("utf-8", subject), body)
	return smtp.SendMail(e.host+":"+e.port, smtp.PlainAuth("", e.from, e.password, e.host), e.from, []string{to}, []byte(message))
}

type TaskChange struct{ Field, OldValue, NewValue string }
type TaskEmailData struct {
	UserName, Action, TaskTitle, TaskDescription string
	Changes                                      []TaskChange
}

const header = `<html><body style="margin:0;padding:24px 12px;background:#0a0f1e;color:#f1f5f9;font:16px Arial,sans-serif">
<div style="max-width:520px;margin:auto;background:#111827;border:1px solid #1e293b;border-radius:16px;overflow:hidden">
<div style="padding:20px 24px;background:#059669;background-image:linear-gradient(90deg,#059669,#0d9488);color:white;font-size:24px;font-weight:bold">⚡ Fokus</div>
<div style="padding:24px">`
const footer = `</div><div style="padding:16px 24px;border-top:1px solid #1e293b;color:#94a3b8">© 2026 Fokus</div></div></body></html>`

var otpTemplate = template.Must(template.New("otp").Parse(header + `
<h2>Your password reset OTP</h2>
<div style="padding:20px;background:#0a0f1e;color:#10b981;text-align:center;letter-spacing:6px;font-size:40px;font-weight:bold">{{.}}</div>
<p>Expires in 10 minutes.</p>` + footer))

var taskTemplate = template.Must(template.New("task").Parse(header + `
<p>Hi {{.UserName}},</p>
<h2 style="color:{{if eq .Action "created"}}#10b981{{else if eq .Action "updated"}}#f59e0b{{else}}#ef4444{{end}}">Task {{.Action}}</h2>
<div style="background:#0a0f1e;padding:16px;border-radius:8px"><strong>{{.TaskTitle}}</strong>{{if .TaskDescription}}<p style="white-space:pre-wrap">{{.TaskDescription}}</p>{{end}}</div>
{{if .Changes}}<h3>What changed</h3><table cellpadding="6">
{{range .Changes}}<tr><th align="left">{{.Field}}</th><td style="color:#ef4444"><del>{{.OldValue}}</del></td><td>→</td><td style="color:#10b981">{{.NewValue}}</td></tr>{{end}}
</table>{{end}}` + footer))

func (e *EmailService) sendTemplate(to, subject string, tmpl *template.Template, data any) error {
	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}
	return e.send(to, subject, body.String())
}

func (e *EmailService) SendOTP(to, otp string) error {
	return e.sendTemplate(to, "Your Fokus Password Reset OTP", otpTemplate, otp)
}

func (e *EmailService) SendTaskNotification(to string, data TaskEmailData) error {
	subjects := map[string]string{"created": "✅ New task created", "updated": "✏️ Task updated", "deleted": "🗑️ Task deleted"}
	subject, ok := subjects[data.Action]
	if !ok {
		return errors.New("unknown task notification action")
	}
	return e.sendTemplate(to, subject, taskTemplate, data)
}
