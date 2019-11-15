export default {
  input: "src/bulletml.js",
  output: [
    {
      format: "umd",
      name: "BulletML",
      file: "build/bulletml.js",
      indent: "\t",
      sourcemap: true
    }
  ],
  watch: {
    include: "src/**"
  },
};
