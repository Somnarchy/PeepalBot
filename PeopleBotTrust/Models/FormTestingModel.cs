using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Models
{
    public class FormTestingModel
    {
        //hidden
        public int Id { get; set; }

        //txtbox
        public string FirstName { get; set; }

        //textarea
        public string Information { get; set; }


        public string Image { get; set; }

        public string Gender { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

        public bool IsMarried { get; set; }

        public string FavoriteCousine { get; set; }

 
        //datepicker
        public DateTime DOB { get; set; }
    }
}