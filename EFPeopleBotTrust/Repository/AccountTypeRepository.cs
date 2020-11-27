using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeopleBotTrust.Repository
{
    public class AccountTypeRepository
    {
        private readonly peepalbot_dbEntities _context;

        public AccountTypeRepository()
        {
            _context = new peepalbot_dbEntities();

        }

        public List<AccountType> GetList()
        {
            return _context.AccountTypes.ToList();
        }

        public AccountType GetDetails(int id)
        {

            return _context.AccountTypes.FirstOrDefault(x => x.Id == id);
        }

        public int Save(AccountType model)
        {
            _context.AccountTypes.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(AccountType model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;            
            _context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            //_context.AccountTypes.Remove(data);
            // OR
            _context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}

