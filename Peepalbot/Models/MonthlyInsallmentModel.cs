using EFPeepalbot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Models
{
    public class MonthlyInstallmentModel
    {
        public Transaction Transaction { get; set; }
        public int Fee { get; set; }
        public  List<TransactionType> FeeCategory { get; set; }
        public Customer Customer { get; set; }
        public Account Account { get; set; }
        //public List<Account> AccountList { get; set; }

        //public List<SelectListItem> AccountTypeList { get; set; }

        public List<SelectListItem> CustomerList { get; set; }

        public List<SelectListItem> TransactionTypeList { get; set; }
        public List<SelectListItem> AccountList { get; set; }
    }
}