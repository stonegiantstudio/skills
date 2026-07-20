# Review — rubric and mechanical gate

## Review rubric (IBM quality characteristics)

Score each 1–5; anything under 4 names a concrete fix.

| Characteristic | Question |
|---|---|
| Task orientation | Does every section serve a task the reader has? |
| Accuracy | Has each command and claim been executed or verified? |
| Completeness | Are prerequisites, errors, and cleanup covered? |
| Clarity | Would the fresh-reader test pass with zero stalls? |
| Retrievability | Can a searcher land mid-doc and orient in one screen? |

## Starter `.vale.ini`

```ini
StylesPath = .vale/styles
MinAlertLevel = suggestion

Packages = Google

[*.md]
BasedOnStyles = Vale, Google
```

Install the package with `vale sync`, then run `vale docs/`. Swap
`Google` for `Microsoft` if the project follows that guide. When Vale
is not installed, review against the rubric above; the tool is a
convenience, not the standard.
