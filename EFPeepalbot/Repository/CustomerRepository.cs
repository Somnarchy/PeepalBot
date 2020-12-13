using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class CustomerRepository
    {
        private readonly PeepalbotEntities _context;
        public CustomerRepository()
        {
            _context = new PeepalbotEntities();

        }

        public List<Customer> GetList()
        {
            return _context.Customers.ToList();
        }

        public Customer GetDetails(int id)
        {

            return _context.Customers.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Customer model)
        {
            _context.Customers.Add(model);
            _context.SaveChanges();
            return model.Id;
        }

        public void Update(Customer model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.Customers.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Customers.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
