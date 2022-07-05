/*@jsxRuntime automatic @jsxImportSource react*/
import {OriginalWrapperName} from '@dummy/import';
function _createMdxContent(props) {
  return <><OriginalWrapperName></OriginalWrapperName></>;
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
export default MDXContent;
