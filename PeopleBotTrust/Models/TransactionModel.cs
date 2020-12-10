using EFPeopleBotTrust;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Models
{
    public class TransactionModel
    {
        public Transaction Transaction { get; set; }
        public Customer Customer { get; set; }
        public Account Account { get; set; }
        public List<SelectListItem> CustomerList { get; set; }
        public List<SelectListItem> TransactionTypeList { get; set; }
        public List<SelectListItem> AccountList { get; set; }
    }
}