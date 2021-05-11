export default function formDataSource(target, validators) {
  function getValidator() {
    const parts = path.split('.');
    return parts.reduce((obj, p) => obj?.[p], validators);
  }

  function getValue(path) {
    const parts = path.split('.');
    return parts.reduce((obj, p) => obj?.[p], target);
  }

  function setValue(path, value) {
    const validate = getValidator(path);

    const parts = path.split('.');
    const prop = parts.pop();
    obj = parts.reduce((obj, p) => obj[p] ?? {}, target);

    obj[prop] = validate(value);
  }

  return {
    use(path) {
      const parts = path.split('.');
      const [state, setState] = useState();
    },
    value() {
    }
  };
}

function test() {
  const ds = formDataSource({
    stringVal: '123',
    node: {
      subnode: {
      }
    }
  }, {
    stringVal: String,
    node: {
      subnode: {
        num: v => isNaN(parseInt(v)) ? parseInt(v) : invalid('must be integer')
      }
    }
  });
}
