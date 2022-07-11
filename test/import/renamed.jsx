/*@jsxRuntime automatic @jsxImportSource react*/
import {OriginalWrapperName as Wrapper} from "@dummy/import";
function _createMdxContent(props) {
  return <Wrapper />;
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
export default MDXContent;
