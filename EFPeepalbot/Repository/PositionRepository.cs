using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class PositionRepository
    {
        private readonly PeepalbotEntities _context;
        public PositionRepository()
        {
            _context = new PeepalbotEntities();
        }

        public List<Position> GetList()
        {
            return _context.Positions.ToList();
        }

        public Position GetDetails(int id)
        {

            return _context.Positions.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Position model)
        {
            _context.Positions.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(Position model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_contextPositions.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Positions.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
