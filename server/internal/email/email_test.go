package email

import (
	"bytes"
	"strings"
	"testing"
)

func TestTaskEmailEscapesUserContent(t *testing.T) {
	data := TaskEmailData{Action: "updated", UserName: "Fokus user", TaskTitle: "<b>Title</b>", Changes: []TaskChange{{"Description", "<old>", "<new>"}}}
	var body bytes.Buffer
	if err := taskTemplate.Execute(&body, data); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"Task updated", "#f59e0b", "&lt;b&gt;Title&lt;/b&gt;", "What changed", "&lt;old&gt;", "&lt;new&gt;"} {
		if !strings.Contains(body.String(), want) {
			t.Errorf("missing %q", want)
		}
	}
	data.Changes = nil
	body.Reset()
	if err := taskTemplate.Execute(&body, data); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(body.String(), "What changed") {
		t.Fatal("unexpected change table")
	}
}
