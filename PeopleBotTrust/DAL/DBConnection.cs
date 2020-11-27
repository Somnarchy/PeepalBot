using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.DAL
{
    public class DBConnection
    {
      public readonly static string connectionString = "Data Source=(LocalDb)\\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\\peepalbot_db.mdf;Initial Catalog=peepalbot_db;Integrated Security=True";
    }
}