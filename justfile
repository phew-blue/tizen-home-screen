ns := "dev"
tools := "deploy/tizen-home-screen-tools"

# Build, sign and install the home screen onto the Family Room TV
tv-install ref="dev":
    kubectl -n {{ns}} exec {{tools}} -c app -- tv-install {{ref}} app

# Install the probe app (spike) onto the TV
tv-probe ref="dev":
    kubectl -n {{ns}} exec {{tools}} -c app -- tv-install {{ref}} probe

# Show the last probe report from the preview server
tv-probe-report:
    curl -fsS https://tizen-home-screen.dev.phew.blue/probe | jq .
