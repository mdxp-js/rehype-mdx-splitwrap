/*@jsxRuntime automatic @jsxImportSource react*/
import {OriginalWrapperName as _Wrapper} from '@dummy/import';
function _createMdxContent(props) {
  return <><_Wrapper></_Wrapper></>;
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
export default MDXContent;
