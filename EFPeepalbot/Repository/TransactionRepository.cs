using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class TransactionRepository
    {
        private readonly PeepalbotEntities _context;
        public TransactionRepository()
        {
            _context = new PeepalbotEntities();

        }

        public List<Transaction> GetList()
        {
            return _context.Transactions.ToList();
        }

        public Transaction GetDetails(int id)
        {

            return _context.Transactions.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Transaction model)
        {
            _context.Transactions.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(Transaction model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.Transactions.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Transactions.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
