using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeopleBotTrust.Repository
{
    //public class AccountTransactionRepository
    //{
    //    private readonly peepalbot_dbEntities _context;
    //    public AccountTransactionRepository()
    //    {
    //        _context = new peepalbot_dbEntities();

    //    }

    //    public List<AccountTransaction> GetList()
    //    {
    //        return _context.AccountTransactions.ToList();
    //    }

    //    public AccountTransaction GetDetails(int id)
    //    {

    //        return _context.AccountTransactions.FirstOrDefault(x => x.Id == id);
    //    }

    //    public int Save(AccountTransaction model)
    //    {
    //        _context.AccountTransactions.Add(model);
    //        var insertedId = _context.SaveChanges();
    //        return insertedId;
    //    }

    //    public void Update(AccountTransaction model)
    //    {
    //        _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
    //        _context.SaveChanges();
    //        //_context.AccountTransactions.Attach(model);
    //        //_context.SaveChanges();
    //    }


    //    public void Delete(int id)
    //    {
    //        var data = GetDetails(id);
    //        _context.AccountTransactions.Remove(data);
    //        // OR
    //        //_context.Entry(data).State = EntityState.Deleted;
    //        _context.SaveChanges();
    //    }
    //}

}
