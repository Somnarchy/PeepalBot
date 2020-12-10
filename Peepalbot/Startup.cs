using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Peepalbot.Startup))]
namespace Peepalbot
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
