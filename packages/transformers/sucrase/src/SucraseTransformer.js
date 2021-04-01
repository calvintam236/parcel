// @flow strict-local

import {Transformer} from '@parcel/plugin';

import sucrase from 'sucrase';

export default (new Transformer({
  async transform({asset}) {
    let code = await asset.getCode();
    asset.type = 'js';
    asset.setCode(
      sucrase.transform(code, ["jsx", "typescript", "flow", "imports"]).code
    );
    return [asset];
  },
}): Transformer);
