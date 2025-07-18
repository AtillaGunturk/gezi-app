@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    TextView tv = new TextView(this);
    tv.setText("Merhaba, uygulama çalışıyor!");
    setContentView(tv);
}
