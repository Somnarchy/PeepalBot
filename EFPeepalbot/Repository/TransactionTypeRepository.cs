using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class TransactionTypeRepository
    {
        private readonly PeepalbotEntities _context;
        public TransactionTypeRepository()
        {
            _context = new PeepalbotEntities();
        }

        public List<TransactionType> GetList()
        {
            return _context.TransactionTypes.ToList();
        }

        public TransactionType GetDetails(int id)
        {

            return _context.TransactionTypes.FirstOrDefault(x => x.Id == id);
        }

        public int Save(TransactionType model)
        {
            _context.TransactionTypes.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(TransactionType model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_contextTransactionTypes.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.TransactionTypes.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
