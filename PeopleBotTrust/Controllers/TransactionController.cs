using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Controllers
{
    public class TransactionController : Controller
    {
        // GET: Transaction
        public ActionResult Index()
        {
       
            return View();
        }


        public ActionResult Detail(int accountId)
        {
            return View();
        }

        /// <summary>
        /// accountId, amount...transaction table data
        /// </summary>
        /// <returns></returns>
        public ActionResult Deposit()
        {
            return View();
        }


        public ActionResult MonthlyMeeting()
        {
            return View();
        }


    }
}