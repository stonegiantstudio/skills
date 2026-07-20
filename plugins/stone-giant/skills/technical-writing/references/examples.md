# Worked example — a runbook that follows the rules

The request: "Write a runbook for restarting a stuck queue worker. The
systemd service is named worker. Jobs must drain first. Restarting
while a job holds the payment lock can double-charge a customer."

## The runbook

> # Restart a stuck queue worker
>
> ## Purpose
>
> This runbook restores service when the worker service stops
> processing jobs. It drains pending work before the restart to
> prevent duplicate charges on payment operations.
>
> ## Prerequisites
>
> - SSH access to the worker host
> - Permission to control the worker service
>
> ## Drain the queue
>
> 1. Stop the intake of new jobs.
>
>    ```bash
>    sudo systemctl stop worker
>    ```
>
> 2. Check how many jobs remain.
>
>    ```bash
>    redis-cli LLEN worker:queue
>    ```
>
> 3. Repeat the check every 30 seconds until the queue reports zero.
>    If a job is still running after 10 minutes, escalate to the
>    platform team.
>
> ## Restart the service
>
> **Warning:** do not restart until the queue reports zero AND the
> payment lock is released (`redis-cli EXISTS worker:payment:lock`
> returns `0`). A restart while the payment lock is held can
> double-charge a customer.
>
> 1. Start the service.
>
>    ```bash
>    sudo systemctl start worker
>    ```
>
> 2. Confirm the service is running.
>
>    ```bash
>    sudo systemctl status worker
>    ```
>
>    The output shows `active (running)`. If it shows `failed`, read
>    the logs with `sudo journalctl -u worker -n 50` and escalate.

## Why it has this shape

| Feature of the runbook | Rule applied |
|---|---|
| Purpose and prerequisites open the page | Every page is page one |
| "This runbook restores service…" | Present tense for facts; active voice naming the actor |
| "Stop the intake. Check how many jobs remain." | One instruction per sentence; imperative for steps |
| The warning sits above the restart command | Warnings before the step they protect |
| "the queue," "the worker service," "the payment lock" throughout | One term, one meaning |
| Numbered steps, one action each | Vertical lists for sequences |
| Doc type: how-to guide — no teaching, no alternatives | Pick one type per document |
