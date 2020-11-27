using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using EFPeopleBotTrust;
namespace PeopleBotTrust.Models
{
    public class AccountViewModel
    {
        public Account Account { get; set; }

        public List<Account> AccountList { get; set; }

        public List<SelectListItem> AccountTypeList { get; set; }

        public List<SelectListItem> CustomerList { get; set; }

    }
}