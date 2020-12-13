using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{

     public class AccountRepository
    {
        private readonly PeepalbotEntities _context;

        public AccountRepository()
        {
            _context = new PeepalbotEntities();
        }

        public List<Account> GetList()
        {
           
            return _context.Accounts.ToList();
        }

        public Account GetDetails(int id)
        {          
            return _context.Accounts.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Account model)
        {
            _context.Accounts.Add(model);
            _context.SaveChanges();
            return model.Id;
        }


        public void Update(Account model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Accounts.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
