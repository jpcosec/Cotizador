export class IStore {
  all() {
    throw new Error('Not implemented');
  }

  where(_predicate) {
    throw new Error('Not implemented');
  }

  find(_predicate) {
    throw new Error('Not implemented');
  }

  insert(_data) {
    throw new Error('Not implemented');
  }

  update(_data) {
    throw new Error('Not implemented');
  }

  deleteById(_id) {
    throw new Error('Not implemented');
  }

  truncate() {
    throw new Error('Not implemented');
  }

  getColumns() {
    throw new Error('Not implemented');
  }

  getByRowIndex(_rowIndex) {
    throw new Error('Not implemented');
  }
}
