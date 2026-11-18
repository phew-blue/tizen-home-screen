# Home key route (experimental)

A tiny native package (`blue.phew.homeroute`) whose `tizen-manifest.xml` adds an
`XF86Home` app-context rule that launches `PhewTvHome.Home`, so the remote's Home
button opens our launcher. The rule targets the launcher directly; `Route.cs` is
only a placeholder entry point. Approach from CleanFrame's 2020 Frame (Tizen 5.5)
report: `nthnclrk/CleanFrame` `docs/frame-2020.md`. Samsung's own Home rule is
untouched; this package adds an overriding one, and uninstalling it removes it.

Installed on the Family Room TV (UE43TU7020, Tizen 5.5) on 2026-11-18.

## Build and sign

Needs a .NET SDK (8 works). Certificates are the 1Password `tizen-home-screen`
`TIZEN_*` fields, written to private files first:

```sh
dotnet build -c Release -p:AuthorPath=author.p12 -p:AuthorPass=... \
  -p:DistributorPath=distributor.p12 -p:DistributorPass=...
# -> bin/Release/tizen50/blue.phew.homeroute-1.0.0.tpk
```

## Install / remove

From the tools pod (copy the .tpk to /tmp/route first):

```sh
tizen install -n blue.phew.homeroute-1.0.0.tpk -s 10.28.160.66:26101 -- /tmp/route
tizen uninstall -p blue.phew.homeroute -s 10.28.160.66:26101   # restores Samsung's Home
```
