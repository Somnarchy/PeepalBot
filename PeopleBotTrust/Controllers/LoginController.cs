using PeopleBotTrust.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Controllers
{
    public class LoginController : Controller
    {

        // declare
        public MemberLoginService  memberLoginService { get; set; }

        public LoginController()
        {
            memberLoginService = new MemberLoginService();
        }

        // GET: Login
        public ActionResult Index()
        {
            var model = memberLoginService.MemberLoginList;
            return View(model);
        }
    }
}