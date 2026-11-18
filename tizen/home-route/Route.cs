// Placeholder entry point. The Home key rule in tizen-manifest.xml targets PhewTvHome.Home
// directly, so this never needs to run; if it does, it opens the launcher.
using System;
using System.Runtime.InteropServices;
class Route
{
    const string Target = "PhewTvHome.Home";
    [DllImport("libaul.so.0")] static extern int aul_launch_app(string app, IntPtr bundle);
    static int Main() { try { return aul_launch_app(Target, IntPtr.Zero) < 0 ? 1 : 0; } catch { return 1; } }
}
